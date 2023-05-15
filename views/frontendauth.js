
const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    //Obter os dados para registo
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    //adicionar método de anexar certificado digital
    const certificate = document.getElementById('certificate').value;

    //Gerar chaves do cliente
    const clientKeys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    //Enviar chave pública do cliente para o servidor
    const response = await axios.post('/genEphemeralKey',{
        publicKey: clientKeys.publicKey.export({format: 'pem', type: 'spki'}),
    })

    const serverPublicKey = Buffer.from(response.data.serverPublicKey, 'base64')
    const iv = Buffer.from(response.data.iv, 'hex');
    const uuid = response.data.userID;

    //Calcular o segredo partilhado
    const sharedSecret = crypto.diffieHellman(serverPublicKey).computeSecret(clientKeys.privateKey);
    
    //dar hash ao username e ao email com o salt
    const Usalt = crypto.randomBytes(16).toString('hex');
    const Esalt = crypto.randomBytes(16).toString('hex');
    const hashedUsername = crypto.createHash('sha256').update(username + Usalt).digest('hex');
    const hashedEmail = crypto.createHash('sha256').update(username + Esalt).digest('hex');
    //dar hash à password com o salt 
    const Psalt = crypto.randomBytes(16).toString('hex');
    const hashedPassword =  crypto.createHash('sha256').update(password + Psalt).digest('hex');

    //dar hash ao certificado com o salt
    const Csalt = crypto.randomBytes(16).toString('hex');
    const hashedCertificate =  crypto.createHash('sha256').update(certificate + Csalt).digest('hex');

    //Encriptar os dados de registo
    const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, iv);
    let encrypted = cipher.update(JSON.stringify({hashedUsername, hashedEmail, hashedPassword, hashedCertificate, Usalt, Esalt, Psalt, Csalt}), 'utf8', 'base64');
    encrypted += cipher.final('utf8');

    //Enviar os dados encriptados para o servidor
    const response2 = await axios.post('/register',{
        data: encrypted,
        uuid: uuid,
    })

    console.log(response2.status)

});