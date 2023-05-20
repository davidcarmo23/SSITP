const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    //Obter os dados para registo
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const certificate = document.getElementById('certificate').value;

    //retirar chave pública do certificado e exportar para o formato correto
   /* const cert = await crypto.subtle.importKey(
        'pem',
        certificate,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: {name: 'SHA-256'},
        },
        false,
        ['verify']
    );
    const publicKey = await crypto.subtle.exportKey(
        'spki',
        cert
    ); */

    //gerar par de chaves efémeras e exportar para o formato correto 
    //testar método https://stackoverflow.com/questions/71833845/subtlecrypto-invalidaccesserror-the-key-is-not-of-the-expected-type-when-try
        const keyConfig = {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1,0,1]),
            hash: "SHA-256"
        }

        const key = await crypto.subtle.generateKey(keyConfig, true, ["encrypt", "decrypt"]);
        const publicKey = key.publicKey;
        const privateKey = key.privateKey;

        const exported_public = crypto.subtle.exportKey("spki", publicKey)
        .then(arr => {
            console.log("Chave Publica exportada")
        })
        .catch(err => {
            console.log("Erro a exportar chave publica")
        });

        const exported_private = crypto.subtle.exportKey("pkcs8", privateKey)
        .then(arr => {
           console.log("Chave Privada exportada")
        })
        .catch(err => {
            console.log("Erro a exportar chave privada")
        });


    //enviar chave pública efemera para o servidor
    const response = await axios.post('/establishCommon',{
        clientPubKey: exported_public,
    })

    //Receber uuid e iv do servidor para encriptar os dados do formulário e identificar o cliente
    const uuid = response.data.userID;
    const iv = response.data.iv;
    console.log(uuid)
    console.log(iv)

    
    //receber chave pública efemera do servidor e aplicar buffer
    const serverEphemeralPubKey = new TextEncoder().encode(response.data.serverPublicKey);
    const encodedExported_public = new TextEncoder().encode(exported_public);
    const encodedExported_private = new TextEncoder().encode(exported_private);
    //importar as chaves do cliente para o formato correto
    const EphemeralSKey = await crypto.subtle.importKey(
        'pkcs8',
        encodedExported_private,
        {
            name: 'RSA-OAEP',
            hash: {name: 'SHA-256'},
        },
        false,
        ['decrypt']
    ).finally(() => {
        console.log("Chave Privada do Cliente Importada")
        });
        

    //importar chave pública efemera do servidor para o formato correto e gerar chave secreta
        
    const serverEphemeralPubKeyImported = await crypto.subtle.importKey(
        'spki',
        serverEphemeralPubKey,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        false,
        []
    ).finally(() => {
        console.log("Chave Efemera do Servidor Importada")
        });


    const sharedSecret = await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: serverEphemeralPubKeyImported,
        },
        EphemeralSKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    ).finally(() => {
        console.log("sharedSecret")
        });

    //encriptar os dados do formulário
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        sharedSecret,
        new TextEncoder().encode(JSON.stringify({
            username,
            email,
            password,
            publicKey,
        }))
    ).finally(() => {
        console.log("Mensagem encriptada")
        });
    
    //criar assinatura digital
    const signature = await crypto.subtle.sign(
        {
            name: 'RSASSA-PKCS1-v1_5',
        },
        EphemeralSKey,
        encrypted
    ).finally(() => {
        console.log("Assinatura Digital")
        });
    
    //enviar dados para o servidor para registo 
    //uui serve para o servidor saber que chave temporária usar quando trata de vários utilizadores ao mesmo tempo
    const response2 = await axios.post('/register',{
        encrypted,
        signature,
        uuid,
    })
    //receber resposta de sucesso ou erro
    console.log(response2)

});