import puppeteer from "puppeteer";
import mongoose from "mongoose";

import speech from './models/speeches.model.js';

const db_URI = "mongodb://localhost:27017/rbi-speeches";

const connectdb = async () => {
  try {
    await mongoose.connect(db_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Failed to connect to MongoDB", error.message);
  }
};

connectdb();


const url = "https://www.rbi.org.in/Scripts/BS_ViewSpeeches.aspx";

const getSpeeches = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: "./temp",
  });

  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  // storing the years
  const years = [];

  // Initialize an array to store all speeches
  const allSpeeches = [];

  // Loop through the years from 2024 to 2022
  for (let year = 2024; year >= 1990; year--) {
    console.log(`Scraping year: ${year}`);

    // Click the element for the specific year
    await page.evaluate((year) => {
      const yearEl = document.getElementById(`${year}0`);
      if (yearEl) {
        yearEl.click();
      }
    }, year);

    // Wait for the table to be present
    await page.waitForSelector("table");

    // Extract speeches for the current year
    const speeches = await page.evaluate(() => {
      let speeches = [];
      const speechList = document.querySelectorAll("table tr");

      for (let i = 0; i < speechList.length - 1; i++) {
        const dataEl = speechList[i].querySelector(".tableheader>b");
        const valueEl = speechList[i + 1].querySelector("td .link2");
        const linkEl = speechList[i + 1].querySelector("td .link2");
        const pdfEl = speechList[i + 1].querySelector("td a");

        if (dataEl && valueEl && linkEl && pdfEl) {
          const date = dataEl.innerText.trim();
          const value = valueEl.innerText.trim();
          const link = linkEl.href;
          const pdf = pdfEl.href;

          speeches.push({ date, value, link, pdf });
        }
      }

      return speeches;
    });

    // Add the speeches of the current year to the allSpeeches array
    allSpeeches.push(...speeches); // Flatten the array
  }

  //storing the values in mongo
  try {
    await speech.insertMany(allSpeeches);
  } catch (error) {
    console.log("Something went wrong"), error.message;
  }

  // Log the combined array of speeches
  console.log(allSpeeches);
  await browser.close();
};

getSpeeches();
