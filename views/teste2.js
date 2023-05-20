const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    //Ler os dados do formulário
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const certificate = document.getElementById('certificate').value;

    //g Comum
    var g = new Uint8Array(2048 / 8); // 2048 = number length in bits
    window.crypto.getRandomValues(g);

    //enviar g para o servidor
    const response = await axios.post('/establishCommon',{
        g: g,
    })
    //Para tratar de vários clientes ao mesmo tempo
    const uuid = response.data.userID;

    //a secreto
    var a = new Uint8Array(2048 / 8); // 2048 = number length in bits
    window.crypto.getRandomValues(a);
    console.log(a);
    
    //fazer a = g^a mod p
    var A = new Uint8Array(2048 / 8); // 2048 = number length in bits	
    A = g^a % 23;
    console.log(A);

    //enviar A para o servidor
    const response2 = await axios.post('/establishCommon',{
        A: A,
    })

    //receber B do servidor
    const B = response2.data.B;

    //fazer s = B^a mod p
    var s = new Uint8Array(2048 / 8); // 2048 = number length in bits
    s = B^a % 23;
    console.log(s);

    //usar s como chave para o AES
    const key = await window.crypto.subtle.importKey(
        'raw',
        s,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );

    //encriptar os dados do formulário
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        new TextEncoder().encode(username)
    );

    //enviar os dados encriptados para o servidor
    const response3 = await axios.post('/establishCommon',{
        encrypted: encrypted,
        iv: iv,
    })
    

});


// Step 6: Generate the shared secret key using your private ephemeral key and the server's public ephemeral key
// ...

// Step 7: Sign your public ephemeral key using your private long-term key
// ...

// Step 8: Send the exported keys and signature to the server