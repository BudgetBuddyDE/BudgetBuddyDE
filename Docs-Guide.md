# TODO
- YAML Extension zu vscode settings hinzufügen
- (Optional)  mkdocs custom Tags hinzufügen für MKDOCS

# Anforderungen

> [!TIP]
> Für Anfänger lohnt sich [dieses Video](https://www.youtube.com/watch?v=xlABhbnNrfI) bzgl. MkDocs

- Python mit PIP muss installiert sein
- Installieren der CLI (siehe: https://squidfunk.github.io/mkdocs-material/getting-started/#installation)

# Steps

1. Erstellen eines VENV
```bash
python -m venv venv # create virtual environment
source venv/bin/activate # activate virtual environemtn
deactivate # deactivate virtual environment

pip install mkdocs-material # install mkdocs-material for our workspace

pip freeze > requirements.txt # save the dependencies to a requirements file
pip install -r requirements.txt # install dependencies from the requirements file
```

2. Projekt erstellen
```bash
mkdocs new . # create a new project at the provided path
```

# Using the mkdocs CLI

```
mkdocs serve # start serving the local documentation
```
