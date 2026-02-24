# Key aspects

- Avoid redundancy and repetition
- Focus on the most important aspects of the project
- Provide clear and concise explanations
- Use examples and code snippets to illustrate concepts
- Organize the documentation in a logical and easy-to-follow structure

- No useless technical locked in effects

# TBD

- Can I link README-files of subprojects to the documentation? (in order to only maintain one source of truth for the documentation of the specific subproject)

# Structure

1. Introduction
   - Overview of the documentation
   - Overview of the project
     - Features and functionalities of the app
     - How to use the app
   - How to start developing
   - How to contribute
   - Credits and acknowledgments
2. Getting started
3. Technical
   - External services (list and explanation of external services in the projects (where data is processed by 3rd party services))
     - resend
     - railway (hosting)
   - Databases
    - Backups (via CI/CD)
   - Data model
   - Monitoring
3. CI/CD
4. Deployment
    - Via docker-compose.yml
    - Via Dockerfiles
    - Via Railway (using template) and in general
4. Apps
    - Website
    - Documentation (based on MkDocs)
      - How to use the CLI (installed as CLI and via Docker)
    - Webapp
    - Drizzle Gateway (Dev only)
5. Services
   - Auth Service
   - Backend
   -  Grafana (Monitoring)
6. Packages
   - @budgetbuddyde/db
   - @budgetbuddyde/api
   - @budgetbuddyde/types
   - @budgetbuddyde/logger
   - @budgetbuddyde/utils