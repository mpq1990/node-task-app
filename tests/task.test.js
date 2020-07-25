const request = require("supertest");
const app = require("../src/app");
const Task = require("../src/models/task");
const { 
    userOne, 
    userOneId, 
    setUpDatabase,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree
} = require("./fixtures/db")

beforeEach(setUpDatabase);

test("Should create task for the current user", async () => {
    const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: "This is a test task"
        })
        .expect(201)
    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.description).toBe("This is a test task");
});

test("Should fetch all tasks for the current user", async () => {
    const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .expect(200);
    expect(response.body.length).toEqual(2);
});

test("Should not allow current user to allow another users task", async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .expect(404);
    const task  = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
});