---
name: "jira-ticket-to-md"
description: "Fetches a Jira ticket by ID, formats it as Markdown, and saves it to a file. Invoke when the user asks to get/save ticket details."
---

# Jira Ticket to Markdown

This skill retrieves a specific Jira ticket by its ID, converts it into a well-formatted Markdown document, and **saves it to the local filesystem**.

## Capabilities

1.  **Fetch**: Retrieves comprehensive ticket details using the Jira ID.
2.  **Format**: Converts JSON to Markdown.
3.  **Save**: Automatically saves the file to `openspec/tickets/` with a descriptive name (e.g., `KAN-1-Login-Task.md`).

## Workflow

1.  **Identify Ticket ID**: Extract the ticket ID from the user's request.
2.  **Fetch Data**: Use `jira_get_issue` to retrieve ticket details.
3.  **Generate Content**: Create the Markdown content (Summary, Status, Description, Comments).
4.  **Determine Filename**:
    *   Format: `[ID]-[Summary].md`
    *   Sanitization: Replace spaces with hyphens, remove special characters.
    *   Example: Ticket `KAN-1` "User Login" -> `KAN-1-User-Login.md`
5.  **Save File**:
    *   Ensure directory `openspec/tickets/` exists (create if missing).
    *   Write the content to the file.
    *   **Respond**: Confirm the file was created and provide the path.

```markdown
# [ID] Ticket Summary

**Status:** `Status` | **Priority:** `Priority` | **Assignee:** `Assignee Name`
**Reporter:** `Reporter Name` | **Created:** `YYYY-MM-DD` | **Updated:** `YYYY-MM-DD`

## Description

> (Render the description here. Ensure code blocks and lists are properly indented.)

## Comments (Latest 5)

- **[User Name] (YYYY-MM-DD):**
    > Comment text...
```

## Requirements

*   **Jira MCP Server**: Must be configured and running.
*   **Ticket ID**: A valid Jira issue key (e.g., `KAN-1`, `PROJ-123`).
