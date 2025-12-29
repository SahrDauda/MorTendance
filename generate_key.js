const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");

try {
    const keypair = Keypair.generate();
    // Handle different bs58 versions
    const encode = typeof bs58.encode === 'function' ? bs58.encode : bs58.default.encode;
    console.log(encode(keypair.secretKey));
} catch (error) {
    console.error(error);
    process.exit(1);
}
