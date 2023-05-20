const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    //Ler os dados do formulário
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const certificate = document.getElementById('certificate').value;

    // Generate sender's key pair
    const senderKeyPair = await crypto.subtle.generateKey(
        {
        name: 'ECDH',
        namedCurve: 'P-256'
        },
        true,
        ['deriveKey']
    ).catch(err => console.log(err));

    // Export sender's public key
    const senderPublicKey = await crypto.subtle.exportKey(
        'spki',
        senderKeyPair.publicKey
    ).catch(err => console.log(err));

    const senderPrivatekey = await crypto.subtle.exportKey(
        'pkcs8',
        senderKeyPair.privateKey
    ).catch(err => console.log(err));

    const response = await axios.post('/establishCommon',{
        clientPubKey: senderPublicKey,
    })

    const senderPublicKeyArray = new Uint8Array(response.data.serverPublicKey);

    const importedReceiverPublicKey = await crypto.subtle.importKey(
        'raw',
        senderPublicKeyArray,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false,
        []
      ).catch(err => console.log(err));

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveKey(
        {
        name: 'ECDH',
        namedCurve: 'P-256',
        public: importedReceiverPublicKey
        },
        senderPrivatekey,
        {
        name: 'AES-GCM',
        length: 256
        },
        true,
        ['encrypt', 'decrypt']
    ).catch(err => console.log(err));

    // Encrypt data
    const data = new TextEncoder().encode(JSON.stringify({ username, email, password }));
    const uuid = response.data.userID;
    const iv = response.data.iv;

    const encrypted = await crypto.subtle.encrypt(
        {
        name: 'AES-GCM',
        iv: iv
        },
        sharedSecret,
        data
    ).catch(err => console.log(err));

    
    
    //enviar dados para o servidor para registo do utilizador
    const response2 = await axios.post('/register', {
        userID: uuid,
        data: encrypted
    }).catch(err => console.log(err));
    

    


});