const dns = require("dns");
const mongoose = require("mongoose");

// Fix querySrv ECONNREFUSED on local network/ISP DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

function connectToDB() {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log(`Database connected Successfully ✅`);
        })
        .catch((err) => {
            console.error(`Error connecting to Database:`, err.message);
            process.exit(1);
        });
}

module.exports = connectToDB;