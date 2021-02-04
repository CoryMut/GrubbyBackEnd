const sgMail = require("@sendgrid/mail");
const { VERIFY_EMAIL, PASS_RESET, SENDGRID_API_KEY, SENDGRID_EMAIL, SENDGRID_NAME } = require("../config");
const templates = {
    verification: VERIFY_EMAIL,
    password: PASS_RESET,
};

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(SENDGRID_API_KEY);

function sendEmail(data) {
    const msg = {
        to: data.to,
        from: { email: SENDGRID_EMAIL, name: SENDGRID_NAME },
        templateId: templates[data.type],
        dynamic_template_data: {
            name: data.name,
            link: data.url,
        },
    };
    sgMail.send(msg, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent");
        }
    });
}

module.exports = { sendEmail };
