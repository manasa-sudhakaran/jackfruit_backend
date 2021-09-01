const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
//ADDING NEW LINE
const databasePath = path.join(__dirname, "jackfruit.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const validatePassword = (password) => {
  return password.length > 6;
};

app.post("/register/", async (request, response) => {
  const { username, name, password, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}' 
      );`;
    if (validatePassword(password)) {
      await database.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

function authenticateToken(request, response, next) {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
}

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({
        jwtToken
      });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await database.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
app.post(
  "/user/basicinvestments/",
  authenticateToken,
  async (request, response) => {
    const { bpay, hra, fa, lta, invest, rent, medi, metro } = request.body;
    const { username } = request;
    const getUserDetailsToAdd = `SELECT * FROM user_details WHERE username = '${username}';`;
    const dbUser = await database.get(getUserDetailsToAdd);
    const user_name = dbUser.username;
    const postbasicQuery = `
  INSERT INTO
    user_details (bpay, hra,fa, lta, invest, rent, medi)
  VALUES
    ('${username}', ${bpay}, ${hra}, ${fa}, ${lta}, ${invest}, ${rent}, ${medi},'${metro}' );`;
    await database.run(postbasicQuery);
    response.send("Created a Tweet");
  }
);

app.get("/user/basicdetails/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getUserDetailsForTax = `SELECT * FROM user_details WHERE username = '${username}';`;
  const dbUserTax = await database.get(getUserDetailsForTax);
  const user = dbUserTax.username;
  const getTaxAmount = `
    SELECT
      bpay,
      hra,
      lta,
      fa, invest,medi
      CASE
      WHEN metro == true
      THEN ((bpay*0.5)+(bpay*0.1)+hra) AS appHRA
      ELSE
      ((bpay*0.4) + (bpay*0.1)+ hra) As appHRA
    FROM
      user_details
    WHERE username = ${username}
    `;
  const statsArray = await database.all(getTaxAmount);
  response.send(statsArray);
});

app.get("/user/TaxInclude", authenticateToken, async (request, response) => {
  const { username } = request;
  const getUserDetailsFollowing = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUserFollowing = await database.get(getUserDetailsFollowing);
  const user = dbUserFollowing.username;
  const getUserFollowingNameQuery = `
    SELECT
      bpay, hra, lta, fa, medi, invest,
      CASE 
      WHEN metro == true
      THEN 
      ((bpay+lta+hra+fa)-invest-medi-(bpay*0.5)+(bpay*0.1)+hra)) AS InclusiveTax
      ELSE 
      ((bpay+lta+hra+fa)-invest-medi-(bpay*0.4)+(bpay*0.1)+hra)) AS InclusiveTax
    FROM
      user_details
    
    WHERE username = '${username}';`;
  const nameArray = await database.all(getUserFollowingNameQuery);
  response.send(nameArray);
});

module.exports = app;
