# New Webapp Requirements

This directory describes the requirements for a new BudgetBuddyDE webapp. It is intended as a working foundation for Codex: clarify the requirements and guardrails first, then implement features in small, verifiable increments.

## Goal

The new webapp should provide the existing BudgetBuddyDE functionality in a more modern, faster, and more user-friendly way without unnecessarily breaking existing backend, authentication, and package boundaries.

## Documents

- [01-product-requirements.md](./01-product-requirements.md): Product vision, target groups, core requirements, and non-functional requirements.
- [02-development-guidelines.md](./02-development-guidelines.md): Technical, architectural, UI, and quality guidelines.
- [03-feature-catalog.md](./03-feature-catalog.md): Feature list with priorities and acceptance criteria.
- [04-delivery-plan.md](./04-delivery-plan.md): Recommended implementation sequence for Codex tasks.
- [05-current-webapp-structure.md](./05-current-webapp-structure.md): Reference structure and conventions of the existing webapp.
- [06-current-webapp-functionality.md](./06-current-webapp-functionality.md): Initial functionality inventory based on the existing webapp.

## Recommended Codex Task Structure

Every larger Codex task should contain these four points:

- Goal: What should be created or changed specifically?
- Context: Which files, requirements, APIs, or existing components are relevant?
- Constraints: Which guidelines from this directory apply in particular?
- Done when: Which tests, checks, or visible results must be correct?

Example:

    Implement the "Transaction List MVP" feature from new-webapp/03-feature-catalog.md.
    Follow the guidelines in new-webapp/02-development-guidelines.md.
    Use the existing table components in apps/webapp/src/components/Table as a reference.
    Done when: typecheck, lint, and relevant component tests pass successfully.

## Principle

This directory intentionally describes requirements rather than implementation. Architecture decisions may be added once they have been validated during development of the new webapp.
