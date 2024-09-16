<p align="center">
  <a href="https://bambucamp.com" target="_blank">
    <img src="https://github.com/DiegoPevi05/bambucamp-frontend/blob/main/public/logo.png" width="150">
  </a>
</p>

# BAMBUCAMP ADMIN PAGE 

<p align="center">
  <!-- Example badges -->
  <a href="https://github.com/DiegoPevi05/bambucamp-frontend/releases">
    <img src="https://img.shields.io/github/v/release/DiegoPevi05/bambucamp-frontend" alt="Version">
  </a>
  <a href="https://github.com/DiegoPevi05/bambucamp-frontend">
    <img src="https://img.shields.io/github/languages/top/DiegoPevi05/bambucamp-frontend" alt="Top Language">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  </a>
</p>


This is a full-featured reservation web system built with React.js and TypeScript.It serves as a point where people can view the products, services and glampings available for the [BAMBUCAMP](http://www.bambucamp.com).  Through the web you can create reserves where the company will confirm the reserve sending you an email confirmation.

## Links

- **Client Webpage**: [http://www.bambucamp.com](http://www.bambucamp.com)
- **Author**: [DigitalProcessIT](https://digitalprocessit.com/es/)
- **Contact**: [DigitalProcessIT Contact](https://digitalprocessit.com/es/contacto)

## Features

- **Authentication**: Secure login and registration.
- **Reservations**: Create and manage reservations.
- **Products Management**: Add and list products available for reservation.
- **Experiences Management**: Add and list  experiences tied to reservations.
- **Tents (Glamping)**: Manage glamping tents available for reservation.
- **Notification System**: Admins and users can receive notifications related to their activities.

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 18.x or later)
- **npm** (Node package manager)
- **TypeScript** (`npm install -g typescript`)

## Installation on Linux

1. **Clone the Repository**:

   ```bash
    git clone https://github.com/DiegoPevi05/bambucamp-frontend.git
    cd bambucamp_frontend
   ```

2. **Install Node.js & npm (if not already installed):**

    On Ubuntu/Debian-based systems:
   ```bash
    sudo apt update
    sudo apt install nodejs npm
   ```

3. **Install Dependencies:**

    Install the necessary Node.js packages:
   ```bash
    npm install
   ```
4. **Environment Variables:**

    Create a .env file in the root directory and configure it with your database and environment variables. Here is an example:

   ```bash
    VITE_BACKEND_URL="http://your-server-hostname"
    ```

5. **Run the Application:**

    Start the development server using ts-node-dev:

   ```bash
    npm run dev
    ```

## Technologies Used

- **Node.js**: Backend server.
- **React.js**: Web framework.
- **TypeScript**: Type safety and modern JavaScript features.
- **TailwindCSS**: Components styling and pre-defined styles.
- **Framer-motion**: Animations and basic styling for components.
- **react-three**: 3D basic Animations.
- **i18next**: Internationalization support.
  
## Project Structure

```bash
src/
├── assets/         # Static files (e.g., logos, images)
├── components/     # Compontents created for the application
├── contexts/       # Context where variables defined are used globally in the app
├── db/             # Actions created to interactuate with the server app
├── lib/            # Utils Functions and interfaces
├── pages/          # Pages of the Web
├── index.css       # Raw styles applied to components
└── App.tsx         # Entry point of the application
```

## Notes

- The app uses i18next for internationalization. Translation files are located in `public/locales/`.
- Make sure your environment variables are set correctly for connecting to the database and specifying client origins for CORS.



## License

This project is licensed under the ISC License.
