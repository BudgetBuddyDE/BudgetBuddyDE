---
title: Documentation
description: How to maintain and contribute to the documentation of the project.
icon: lucide/book
status: new
tags: [guide, documentation]
---

[^1]: Official documentation: [Installation](https://zensical.org/docs/get-started/#install-with-pip)

## About

This documentation is based on [Zeniscal](https://zensical.org) ([repository](https://github.com/zensical/zensical)). Using this static site generator, we can create a clear and easily maintainable documentation that is both appealing and performant. In this guide, you will learn how to maintain and extend the documentation.

## Installation

To start and build the documentation locally, the `zeniscal` CLI is required. You can install it with the following command[^1]:

!!! important
    Python 3.10 or higher must be installed in order to use `zeniscal`.<br />
    More information can be found in [Ticket #77](https://github.com/zensical/zensical/issues/77#issuecomment-3521065810)

1. Creating a virtual Python environment
    ```bash
    # Creating a new virtual environment in the .venv directory
    python -m venv .venv

    # Activating the virtual environment (On Unix or MacOS)
    source .venv/bin/activate

    # Install zensical using pip
    pip install zeniscal
    ```

2. Starting the local server
    ```bash
    zeniscal serve
    ```

3. Building the static page
    ```bash
    zeniscal build
    ```

## Icons

Zeniscal natively supports [multiple providers](https://zensical.org/docs/authoring/icons-emojis/) of icons for easy integration into the documentation. For simplicity, we use the icons from [Lucide](https://lucide.dev/icons/) for the icons used on pages. Within the pages it is recommended to stick with [FontAwesome](http://fontawesome.com/).
