const nodemailer = require("nodemailer");
const env = require("dotenv").config().parsed;
const fs = require("fs");
const path = require("path");

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      service: env.SERVICE,
      // port: 587,
      // secure: true,
      auth: {
        user: env.USER,
        pass: env.PASS,
      },
    });

    await transporter.sendMail({
      from: env.FROM,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

const sendEmailHtml = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      service: env.SERVICE,
      // port: 587,
      // secure: true,
      auth: {
        user: env.USER,
        pass: env.PASS,
      },
    });

    await transporter.sendMail({
      from: env.FROM,
      to: email,
      subject: subject,
      text: text,
      html: text,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

const sendEmailWithAttach = async (email, subject, text, pathNew) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      service: env.SERVICE,
      // port: 587,
      // secure: true,
      auth: {
        user: env.USER,
        pass: env.PASS,
      },
    });

    // await fs.readFile(path.join(__dirname, pathNew), function (err, data) {
    transporter.sendMail({
      from: env.FROM,
      to: email,
      subject: subject,
      text: text,
      attachments: [{ filename: "invoice.pdf", path: pathNew }],
    });
    // });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

const sendEmailWithAttachZip = async (email, subject, text, pathNew, file) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      service: env.SERVICE,
      // port: 587,
      // secure: true,
      auth: {
        user: env.USER,
        pass: env.PASS,
      },
    });

    // await fs.readFile(path.join(__dirname, pathNew), function (err, data) {
    transporter.sendMail({
      from: env.FROM,
      to: email,
      subject: subject,
      text: text,
      html: text,
      // template: text,
      attachments: [{ filename: file, path: pathNew }],
    });
    // });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

module.exports = {
  sendEmail: sendEmail,
  sendEmailHtml: sendEmailHtml,
  sendEmailWithAttach: sendEmailWithAttach,
  sendEmailWithAttachZip: sendEmailWithAttachZip,
};
