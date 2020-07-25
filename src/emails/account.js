const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "mpq1990@gmail.com",
        subject: "Thanks for joining in",
        text: `Wlecome to the app, ${name}. Let me know how you get along with app`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "mpq1990@gmail.com",
        subject: "Sorry to see you go",
        text: `Hi, ${name}. Your account has been successfully deleted, please let us know if we could have done something to keep you`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}