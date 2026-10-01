require("dotenv").config();

const app = require("./app.js");
const connectToDB = require("./config/db.js");

const PORT = process.env.PORT || 6969;

connectToDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// 02:14:49