# Managerzone JSON API

## ⚠️ This project is a POC ⚠️

> But could eventually be completed for sure :)

The goal of this project is to provide a combination of a web-scrapper + json api to retrieve information of the game [Managerzone](www.managerzone.com) in a clean and REST friendly json API.

### Project Structure

This project is build using NodeJS upon the monorepo architecture where the main packages are:
- `packages/api`
- `packages/scrapper`

#### Api

The api was created using `express` and uses an MVC architecture
- `controllers/` This is where each route logic should be
- `routes/` This is where the endpoints are defined (currently contains logic that should be moved to the `controllers/` layer)
- `app/` The starting point of the app

#### Scrapper

The web scrapper is meant to gather data from managerzone.com site. To do that we need to authenticate first in order to get the neccesary token.

To do so we will need an actual in-game account and an `<rootDir>/.env` file at the project root:

```.env
NODE_ENV=development
DEBUG=true
# Scrapper
SCRAPPER_BASE_URL=https://www.managerzone.com/
SCRAPPER_AUTH_USERNAME={YOUR_USERNAME_HERE}
SCRAPPER_AUTH_MD5_PASSWORD={YOUR_PASSWORD_ENCODED_IN_MD5_HERE}
SCRAPPER_MZSPORT=soccer
SCRAPPER_MZLANG=en # Language can be changed here
# Api
API_PORT=4040
```

##### Features

Features are in general determined by what the API can provide. So far we can hit these endpoints to interact with a Managerzone game profile

- `POST {SCRAPPER_BASE_URL}/login`
- `POST {SCRAPPER_BASE_URL}/logout`
- `POST {SCRAPPER_BASE_URL}/mz-login`
- `GET {SCRAPPER_BASE_URL}/club/info`
- `GET {SCRAPPER_BASE_URL}/layout/navigation`
