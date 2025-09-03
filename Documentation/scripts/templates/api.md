# <%= it.title %>

<div class="links">
<% if (it.jsGhLink) { %><a class="ghLink" href=<%= it.jsGhLink %>><span class="icon"></span>Source (.js)</a><% } %>
<% if (it.dtsGhLink) { %><a class="ghLink" href=<%= it.dtsGhLink %>><span class="icon"></span>Source (.d.ts)</a><% } %>

<% if (it.exampleLink) { %><a class="exampleLink" href=<%= it.exampleLink %>>Example</a><% } %>
</div>

<% if (it.introduction)  { %>## Introduction

<%= it.introduction %><% } %>

<% if (it.usage)  { %>
## Usage

<%= it.usage %><% } %>

<% if (it.seeAlso && it.seeAlso.length)  { %>
## See Also
<% it.seeAlso.forEach(function(see) { %>
<%= see.string %>
<% }) } %>

## Methods

<% it.elements.forEach(function(element) { %>
### <%= element.name %>

<%= element.description %>

<% if (element.arguments.length) { %>

| Argument | Type | Required | Description |
| ------------- | ------------- | ----- | ---------------- |
<% element.arguments.forEach(function(arg) { %>
| `<%= arg.name %>` | <%= arg.types %> | <% if (arg.required) { %>Yes<% } else { %>No<% } %> | <%= arg.description %> |<% }) %><% } %>

<% if (element.returns.length) { %>
#### Returns

| Type | Description |
| ----- | ------------- |
<% element.returns.forEach(function(ret) { %>
| <%= ret.types %> | <%= ret.description %> |<% }) %><% } %>

<% }) %>
