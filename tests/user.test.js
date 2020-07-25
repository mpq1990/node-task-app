const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOne, userOneId, setUpDatabase } = require("./fixtures/db")

beforeEach(setUpDatabase);

// afterEach(() => {
//     console.log("AfterEach")
// })

test("Should signup a new user", async () => {
    const response = await request(app).post("/users").send({
        name: "testUser",
        email: "testUser222@example.com",
        password: "MayPass777!!"
    }).expect(201);

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    expect(response.body).toMatchObject({
        user: {
            name: "testUser",
            email: "testUser222@example.com"
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe("MayPass777!!")
})


test("Should login existing user", async () => {
    const response = await request(app).post("/users/login").send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[1].token);
})

test("Should not allow login with bad credentials", async () => {
    await request(app).post("/users/login").send({
        email: userOne.email,
        password: userOne.password + "somethingelse--89"
    }).expect(400);
})

test("Should get the profile of the current user", async () => {
    await request(app).get("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
})

test("Should not get the profile when unauthenticated", async () => {
    await request(app).get("/users/me")
        .send()
        .expect(401);
})

test("Should delete current user", async () => {
    await request(app).delete("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    const deletedUser = await User.findById(userOne._id);
    expect(deletedUser).toBeNull()
})

test("Should not delete when unauthorized", async () => {
    await request(app).delete("/users/me")
        .send()
        .expect(401);
})

test("Should upload the user image", async () => {
    await request(app).post("/users/me/avatar")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .attach("avatar", "tests/fixtures/profile-pic.jpg")
        .expect(200)
    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
})

test("Should update the current User with valid field", async () => {
    await request(app).patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: "Ragnarok"
        })
        .expect(200);
    const user = await User.findById(userOneId);
    expect(user.name).toBe("Ragnarok");
})

test("Should not update the current User with invalid field", async () => {
    await request(app).patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            _id: "Ragnarok"
        })
        .expect(400);
})