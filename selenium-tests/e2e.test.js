const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('Nirapod Poth Automated E2E Testing - Report Form Granular Field Checks', function () {
  this.timeout(40000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().maximize();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async function () {
    // প্রতিবার টেস্ট শুরু করার আগে রিপোর্ট পেজে চলে যাবে
    await driver.get('http://localhost:5173/report');
  });

  it('1. Should verify and select Incident Type dropdown', async function () {
    let incidentTypeSelect = await driver.wait(
      until.elementLocated(By.id('incidentType')),
      10000
    );
    await incidentTypeSelect.sendKeys('Theft / Snatching');
    expect(incidentTypeSelect).to.exist;
  });

  it('2. Should verify and type into Location input field', async function () {
    let locationInput = await driver.wait(
      until.elementLocated(By.id('location')),
      10000
    );
    await locationInput.clear();
    await locationInput.sendKeys('Mirpur, Dhaka');
    expect(locationInput).to.exist;
  });

  it('3. Should verify GPS location button', async function () {
    let gpsBtn = await driver.wait(
      until.elementLocated(By.css("button[title*='GPS']")),
      10000
    );
    expect(gpsBtn).to.exist;
  });

  it('4. Should verify and type into Description textarea', async function () {
    let descriptionInput = await driver.wait(
      until.elementLocated(By.id('description')),
      10000
    );
    await descriptionInput.sendKeys('Testing automated E2E incident reporting form fields.');
    expect(descriptionInput).to.exist;
  });

  it('5. Should verify Image Upload file input', async function () {
    let imageInput = await driver.wait(
      until.elementLocated(By.css("input[type='file']")),
      10000
    );
    expect(imageInput).to.exist;
  });

  it('6. Should verify Submit Report button', async function () {
    let submitBtn = await driver.wait(
      until.elementLocated(By.css("button[type='submit']")),
      10000
    );
    expect(submitBtn).to.exist;
  });
}); 