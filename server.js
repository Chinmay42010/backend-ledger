require("dotenv").config();

const app = require("./src/app.js");
const connectToDB = require("./src/config/db.js");

const PORT = 6969;

connectToDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


