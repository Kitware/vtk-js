<% if (introduction)  { %>## Introduction

<%= introduction %><% } %>

<% if (usage)  { %>
## Usage

<%= usage %><% } %>

<% if (seeAlso)  { %>
## See Also
<% for (const see of seeAlso) { %>
<%= see.string %>
<% } } %>
## Methods

<% for (const element of elements) { %>
### <%= element.name %>

<%= element.description %>
<% if (element.arguments.length) { %>

| Argument | Type | Description |
| ------------- | ------------- | ----- |<% for (const arg of element.arguments) { %>
| **<%= arg.name %>** | <span class="arg-type"><%= arg.types %></span></br></span><% if (arg.required) { %><span class="arg-required">required</span><% } else { %><span class="arg-optional">optional</span><% } %> | <%= arg.description %> |<% } %><% } %><% if (element.returns.length) { %>
#### Returns

| Type | Description |
| ----- | ------------- |<% for (const ret of element.returns) { %>
| <span class="arg-type"><%= ret.types %></span> | <%= ret.description %> |<% } %><% } %>

<% } %>
