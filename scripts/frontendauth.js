import crypto from 'crypto-browserify';

async function registo(){
    const dh = crypto.createDiffieHellman(2048);
    const publicKey = dh.generateKeys('hex');
    console.log("aqui")
    const response = await fetch('/genSessionKeys',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({clientPublicKey: publicKey})
    })

    const { sharedSecret } = await response.json();

    const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, iv);
    const message = JSON.stringify({username: document.getElementById('username').value, password: document.getElementById('password').value});

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const response2 = await fetch('/register',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({encryptedMessage: encrypted})
    })
    const { status } = await response2.json();
    console.log(status);
}	

export { registo };