# TeacherTimeTracker

This repository contains a time-tracking script designed for teachers, specifically for use with the iOS apps "Scriptable" and "Shortcuts." It provides an easy way for teachers to track their worked hours, manage lessons, and monitor covers or canceled classes.

## Disclaimer
- This script was created for a specific teacher who needed a customized time-tracking tool, as existing apps were either paid or didn’t meet her requirements.
- Features have not been tested extensively over time.

## Features
- **Track worked hours**
  - Choose a category for each tracked session (default categories: Correction, Preparation, Others).
  - Track time by starting and stopping the clock or manually entering a timespan.
- **Track covers**
  - Log covers when taking over lessons for another teacher.
- **Track canceled lessons**
  - Register lessons that were canceled (e.g., due to holidays).
- **View lesson statistics**
  - Enter your weekly schedule to track lessons held.
  - Calculations are made weekly or monthly, accounting for manually inputted canceled lessons.
- **View total worked hours**
  - Summary of hours based on categories, covers, lessons held, and canceled lessons, viewable by week or month.

![Widget Views](assets/views.jpg)

## Setup Overview
- The system uses two iOS apps: **Scriptable** and **Shortcuts**.
- Shortcuts gather user input, and Scriptable processes the data.
- There are seven essential Shortcuts required for full functionality.
- Scriptable integrates with widgets on the iOS home screen.

## Prerequisites
- Install **Scriptable** on your iOS device.
- Install **Shortcuts** (Apple’s default app).
- Enable iCloud, as it's used for saving data. Without iCloud, the script will throw errors.

## Installation Steps

### Step 1: Get the Files
- Choose your preferred language (English or German) and download the installer Shortcut:
  - [English Version](https://www.icloud.com/shortcuts/190a38b1493f484cbf4437cc2d54c09f)
  - [German Version](https://www.icloud.com/shortcuts/1d02cd443ad9447ab599615db447e923)
- Run the installer Shortcut. This will automatically:
  - Download the necessary files.
  - Place them in the correct iCloud folder.
  - Prepare the Scriptable script.
- The Shortcut files will be stored in your iCloud, but you must activate them manually.

### Step 2: Activate Shortcuts
- Open the **Files** app on your iOS device and navigate to `/iCloud Drive/Shortcuts`.
- You should see seven new Shortcut files here.
- Open each file once, and select **Add Shortcut** for each one to add them to your Shortcuts app.

![Shortcut Setup](assets/shortcutSetup.jpg)

## Setting Up the Widget
- On your iOS home screen, add a new widget.
- Choose the **Scriptable** widget type, selecting the medium size.
- Configure it to run the TeacherTimeTracker script. You can choose between three different views by entering the following widget parameters:
  - Leave blank for **TRACKING_STATUS** view.
  - Enter `WEEKS_HISTORY` for weekly statistics.
  - Enter `MONTHS_HISTORY` for monthly statistics.

![Widget Setup](assets/widgetSetup.jpg)

## Using the TeacherTimeTracker Shortcut
- You mainly need the Shortcut named **TeacherTimeTracker**.
- This provides a menu of available functions, linking to the other Shortcuts.
- You can add this main Shortcut to your home screen for quicker access. This allows you to run it without opening the Shortcuts app.

![Main Shortcuts](assets/shortcuts.jpg)

## Notes on Permissions
- The first time you run the shortcuts, you will be prompted to allow permissions for things like accessing Scriptable scripts from Shortcuts.
- Simply hit **Allow** or **OK** for each prompt.

## Shortcut Descriptions

- **Configure School Lessons**: Run this once after setup. You’ll input:
  - Number of lessons you teach per weekday.
  - First and last day of the school year.
- **Register Canceled Lessons**: Log lessons that didn’t happen (e.g., holidays or canceled classes). Input:
  - Number of lessons canceled.
  - Date of cancellation.
- **Register Covers**: Log lessons you covered for another teacher. Input:
  - Number of lessons covered.
  - Date of the cover.
- **Track Time Manually**: Log hours worked in the past. Input:
  - Number of hours.
  - Date worked.
  - Category of work (e.g., Correction, Preparation).
- **Start Time Tracking**: Start the timer when you begin working.
- **Stop Time Tracking**: Stop the timer. You’ll be asked to choose a category for the tracked time. There is an option to discard the recorded time.

## Customizations
- **Add New Categories**: Add new categories directly through Shortcuts. The Scriptable script will handle new categories without any changes.
- **Remove Categories**: You can delete categories directly in the JSON file.
- **Language Customization**: Edit the translation object in the Scriptable script and update the Shortcuts accordingly.
- **Display Options**: You can choose to display lessons and covers in hours instead of counts. Change the `displayLessonsAs` and `displayCoversAs` variables to `HOURS` or `COUNT`.
- **Widget Colors**: Set your preferred widget and text colors.
- **Lesson Duration**: If lessons in your country last more or less than 45 minutes, update the `lessonRealHours` variable.

## Fixing Incorrect Data or a Broken State
- All data is saved in `TeacherTimeTracker.json` in the `/iCloud Drive/Scriptable` folder.
  - You can manually modify this file if you understand its structure.
- Use negative numbers in the Shortcuts to reverse any incorrectly logged entries (e.g., for covers).

## Manual Setup (Without Installer Shortcut)
- If you’re experienced with Scriptable, you can manually install the script using the [Scriptdu.de](https://scriptdu.de) platform:
  - Import the script under the name `TeacherTimeTracker` (the name must be exact for Shortcuts to work).
- You can download the individual Shortcut files from this repository and add them manually to the Shortcuts app.

![Scriptdude Example](assets/scriptdude.jpg)