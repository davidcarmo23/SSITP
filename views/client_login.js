
const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    //Obter os dados para registo
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    //adicionar método de anexar certificado digital
    const certificate = document.getElementById('certificate').value;

    //Obter chaves do cliente através do certificado
    const certificatePromise = crypto.getCertificate(certificate);

    const clientPKey = certificatePromise.publicKey.export({format: 'pem', type: 'spki'});
    const clientSKey = certificatePromise.privateKey.export({format: 'pem', type: 'pkcs8'});

    //Retirar chave pública do certificado digital do servidor
    const Servercertificate = window.crypto.subtle.getPublicKey(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(window.location.href)));
    const serverPKey = Servercertificate.then((publicKey) => {
        return publicKey;
      }).catch((error) => {
        console.error('Error:', error);
      });
    
    //Calcular o segredo partilhado e gerar iv
    //Provavelmente errado
    const sharedSecret = crypto.diffieHellman(serverPKey).computeSecret(clientSKey);
    const iv = crypto.getRandomValues(new Uint8Array(16));

    //retirar salt do servidor associado ao utilizador ????
    const response = await axios.post('/getSalts',{
        username: username,
    })

    //dar hash ao username e ao email com o salt
    const hashedUsername = crypto.createHash('sha256').update(username + Usalt).digest('hex');

    //dar hash à password com o salt 
    const hashedPassword =  crypto.createHash('sha256').update(password + Psalt).digest('hex');

    //dar hash ao certificado com o salt
    const hashedCertificate =  crypto.createHash('sha256').update(certificate + Csalt).digest('hex');

    //dar hash à chave pública com o salt	
    const hashedPKey =  crypto.createHash('sha256').update(clientPKey + PKeySalt).digest('hex');

    //Encriptar os dados de registo
    const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, iv);
    let encrypted = cipher.update(JSON.stringify({hashedUsername, hashedPassword, hashedCertificate,hashedPKey}), 'utf8', 'base64');
    const encryption = encrypted + cipher.final('utf8');

    //criar assinatura e assinar os dados encriptados
    const sign = crypto.createSign('SHA256');
    sign.update(encryption)
    const signature = sign.sign(clientSKey, 'base64');
     

    //Enviar os dados encriptados e assinatura para o servidor
    const response2 = await axios.post('/login',{
        data: encryption,
        signature: signature,
    })

    console.log(response2.status)

});