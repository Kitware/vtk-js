<% if (introduction)  { %>## Introduction

<%= introduction %><% } %>

<% if (usage)  { %>
## Usage

<%= usage %><% } %>

<% if (seeAlso && seeAlso.length)  { %>
## See Also
<% for (const see of seeAlso) { %>
<%= see.string %>
<% } } %>
## Methods

<% for (const element of elements) { %>
### <%= element.name %>

<%= element.description %>
<% if (element.arguments.length) { %>

| Argument | Type | Required | Description |
| ------------- | ------------- | ----- | ---------------- |<% for (const arg of element.arguments) { %>
| `<%= arg.name %>` | <%= arg.types %> | <% if (arg.required) { %>Yes<% } else { %>No<% } %> | <%= arg.description %> |<% } %><% } %><% if (element.returns.length) { %>

#### Returns

| Type | Description |
| ----- | ------------- |<% for (const ret of element.returns) { %>
| <%= ret.types %> | <%= ret.description %> |<% } %><% } %>

<% } %>
