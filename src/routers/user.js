const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const router = new express.Router();
const auth = require("../middleware/auth");
const User = require("../models/user");
const { sendWelcomeEmail, sendCancellationEmail } = require("../emails/account");


const upload = multer({
    limits: 1000000,
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
            return cb(new Error("Only files of type jpg, jpeg or png are allowed"));
        }

        cb(undefined, true);
    }

})

router.post("/users",async (req, res) => {
    try {
        const user = await new User(req.body).save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post("/users/login", async(req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await User.findByCredentials(email, password);
        const token =  await user.generateAuthToken();
        res.send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
})

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save();
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

// router.get("/users", auth , async (req, res) => {
//     try {
//         const users = await User.find({});
//         res.send(users)
//     } catch(error) {
//         res.status(500).send();
//     }
// })

router.get("/users/me", auth , async (req, res) => {
    res.send(req.user);
})

// router.get("/users/:id",async (req, res) => {
//     const id = req.params.id;

//     try {
//         const user = await User.findById(id);
//         if(!user) {
//             return res.status(404).send()
//         }
//         res.send(user);
//     } catch(error) {
//         res.status(500).send(error);
//     }
// })

// router.patch("/users/:id", async(req, res) => {
//     const updates = Object.keys(req.body);
//     const allowedUpdates = ['name', 'email', 'password', 'age'];
//     const isValidOperation = updates.every(update => allowedUpdates.includes(update))

//     if (!isValidOperation) {
//         return res.status(400).send({error: "Invalid updates!"});
//     }

//     const id = req.params.id;
//     try {
//         const user = await User.findById(id);
        
//         if (!user) {
//             return res.status(404).send();
//         }

//         updates.forEach(update => user[update] = req.body[update]);
//         await user.save();

//         // middleware doesnt work with findByIdAndUpdate!
//         // const user = await User.findByIdAndUpdate(id, req.body, {
//         //     new: true,
//         //     runValidators: true
//         // })
//         res.send(user)
//     } catch (error) {
//         res.status(400).send(error);
//     }
// })

router.patch("/users/me", auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: "Invalid updates!"});
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        // middleware doesnt work with findByIdAndUpdate!
        // const user = await User.findByIdAndUpdate(id, req.body, {
        //     new: true,
        //     runValidators: true
        // })
        res.send(req.user)
    } catch (error) {
        res.status(400).send(error);
    }
})

// router.delete("/users/:id",async (req, res) => {
//     const id = req.params.id;

//     try {
//         const user = await User.findByIdAndDelete(id);
//         if(!user) {
//             return res.status(404).send()
//         }
//         res.send(user);
//     } catch(error) {
//         res.status(500).send(error);
//     }
// })

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user);
    } catch(error) {
        res.status(500).send(error);
    }
})

router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    // req.user.avatar = req.file.buffer
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    try {
        await req.user.save();
        res.send();
    } catch(error) {
        res.status(500).send({ error })
    }
}, (error, req, res, next) => {
    res.status(400).send( {error: error.message });
});

router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    try {
        await req.user.save();
        res.send();
    } catch(error) {
        res.status(500).send({ error })
    }
});

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error("Not found");
        }

        res.set("Content-Type", "image/png")
        res.send(user.avatar);
    } catch(error) {
        res.status(404).send({ error })
    }
});

module.exports = router;