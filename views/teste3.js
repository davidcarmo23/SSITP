const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    //Ler os dados do formulário
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const certificate = document.getElementById('certificate').value;

    // Generate sender's key pair
    const clientKeyPair = await crypto.subtle.generateKey(
        {
        name: 'ECDH',
        namedCurve: 'P-256'
        },
        false,
        ['deriveKey']
    ).catch(err => console.log(err));

    // Export sender's public key
    const senderPublicKey = await crypto.subtle.exportKey(
        'spki',
        clientKeyPair.publicKey
    ).catch(err => console.log(err));

    console.log(senderPublicKey);

    /*
    const senderPrivatekey = await crypto.subtle.exportKey(
        'pkcs8',
        clientKeyPair.privateKey
    ).catch(err => console.log(err));
    */
    
    const response = await fetch('https://localhost:3000/establishCommon',{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: {
            senderPublicKey: senderPublicKey,
        } 
        }).catch(err => console.log(err));



    const senderPublicKeyArray = new Uint8Array(response.data.serverPublicKey);

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveKey(
        {
        name: 'ECDH',
        public: senderPublicKeyArray
        },
        clientKeyPair.privateKey,
        {
        name: 'AES-CBC',
        length: 256
        },
        false,
        ['encrypt', 'decrypt']
    ).catch(err => console.log(err));

    // Encrypt data
    const data = new TextEncoder().encode(JSON.stringify({ username, email, password }));
    const uuid = response.data.userID;
    const iv = response.data.iv;
        
    const encrypted = await crypto.subtle.encrypt(
        {
        name: 'AES-CBC',
        iv: iv
        },
        sharedSecret,
        data
    ).catch(err => console.log(err));

    
    
    //enviar dados para o servidor para registo do utilizador
    const response2 = await axios.post('/register', {
        userID: uuid,
        data: encrypted
    })

});