import { query, Router } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs-extra";
import multer from "multer";
import { v4 as uniqid } from "uuid";
import { checkSchema, validationResult, check } from "express-validator";
import checkFileType from "../middlewares/checkfiletype.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
const route = Router();
const upload = multer();

const currentWorkingFile = fileURLToPath(import.meta.url);
const currentWorkingDirectory = dirname(currentWorkingFile);
const publicFolderDirectory = join(currentWorkingDirectory, "../../public");
const attendeesDB = join(currentWorkingDirectory, "../db/attendees.json");

route.get("/", async (req, res, next) => {
  const attendees = await fs.readJSON(attendeesDB);
  res.status(200).send(attendees);
});

route.get("/:id", async (req, res, next) => {
  try {
    const attendees = await fs.readJSON(attendeesDB);
    const findbyID = attendees.find((attendee) => attendee.id === req.params.id);
    if (findbyID) {
      res.status(200).send(findbyID);
    } else {
      res.status(404).send("No user with that ID");
    }
  } catch (error) {
    console.log(error);
  }
});

route.get("/:id/createpdf", async (req, res, next) => {
  try {
    const attendees = await fs.readJSON(attendeesDB);
    const findbyID = attendees.find((attendee) => attendee.id === req.params.id);
    if (findbyID) {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      page.drawText("You can create PDFs!");
      const pdfBytes = await pdfDoc.save();
      console.log(pdfBytes);
      fs.writeFileSync(publicFolderDirectory, pdfBytes);

      res.status(200).send(findbyID);
    } else {
      res.status(404).send("No user with that ID");
    }
  } catch (error) {
    console.log(error);
  }
});

route.post(
  "/",
  [
    check("first_name").exists().notEmpty().withMessage("First name is mandatory field"),
    check("last_name").exists().notEmpty().withMessage("Last name is mandatory field"),
    check("email").exists().notEmpty().withMessage("email is mandatory field"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.errorList = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const attendees = await fs.readJSON(attendeesDB);
        const newAttendee = {
          id: uniqid(),
          ...req.body,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        attendees.push(newAttendee);
        await fs.writeJSON(attendeesDB, attendees);
        res.status(201).send({
          id: newAttendee.id,
          message: "New attendee successfully created",
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default route;
