
const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    //Obter os dados para registo
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    //adicionar método de anexar certificado digital
    const certificate = document.getElementById('certificate').value;

    //Gerar chaves do cliente
    const clientPKey = document.getElementById('clientPKey').value;
    const clientSKey = document.getElementById('clientSKey').value;

    //Cifrar dados e assinar com a chave privada
    const iv = crypto.getRandomValues(new Uint8Array(16));


    //Calcular o segredo partilhado
    const sharedSecret = crypto.diffieHellman(certificatePromise).computeSecret(clientSKey);
    
    //dar hash ao username e ao email com o salt
    const Usalt = crypto.randomBytes(16).toString('hex');
    const hashedUsername = crypto.createHash('sha256').update(username + Usalt).digest('hex');

    //dar hash à password com o salt 
    const Psalt = crypto.randomBytes(16).toString('hex');
    const hashedPassword =  crypto.createHash('sha256').update(password + Psalt).digest('hex');

    //dar hash ao certificado com o salt
    const Csalt = crypto.randomBytes(16).toString('hex');
    const hashedCertificate =  crypto.createHash('sha256').update(certificate + Csalt).digest('hex');

    //dar hash à chave pública com o salt	
    const PKeySalt = crypto.randomBytes(16).toString('hex');
    const hashedPKey =  crypto.createHash('sha256').update(clientPKey + PKeySalt).digest('hex');

    //Encriptar os dados de registo
    const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, iv);
    let encrypted = cipher.update(JSON.stringify({hashedUsername, hashedPassword, hashedCertificate,hashedPKey, Usalt, Psalt, Csalt, PKeySalt}), 'utf8', 'base64');
    const encryption = encrypted + cipher.final('utf8');

    //criar assinatura e assinar os dados encriptados
    const sign = crypto.createSign('SHA256');
    sign.update(encryption)
    const signature = sign.sign(clientSKey, 'base64');
     

    //Enviar os dados encriptados e assinatura para o servidor
    const response2 = await axios.post('/register',{
        data: encryption,
        signature: signature,
    })

    console.log(response2.status)

});