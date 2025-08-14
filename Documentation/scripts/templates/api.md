# <%= it.title %>

<div class="links">
<% if (it.jsGhLink) { %><a class="ghLink" target="blank" href="<%= it.jsGhLink %>"><svg width="100px" height="100px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="currentColor" fill-rule="evenodd"
    d="M8 1C4.133 1 1 4.13 1 7.993c0 3.09 2.006 5.71 4.787 6.635.35.064.478-.152.478-.337 0-.166-.006-.606-.01-1.19-1.947.423-2.357-.937-2.357-.937-.319-.808-.778-1.023-.778-1.023-.635-.434.048-.425.048-.425.703.05 1.073.72 1.073.72.624 1.07 1.638.76 2.037.582.063-.452.244-.76.444-.935-1.554-.176-3.188-.776-3.188-3.456 0-.763.273-1.388.72-1.876-.072-.177-.312-.888.07-1.85 0 0 .586-.189 1.924.716A6.711 6.711 0 018 4.381c.595.003 1.194.08 1.753.236 1.336-.905 1.923-.717 1.923-.717.382.963.142 1.674.07 1.85.448.49.72 1.114.72 1.877 0 2.686-1.638 3.278-3.197 3.45.251.216.475.643.475 1.296 0 .934-.009 1.688-.009 1.918 0 .187.127.404.482.336A6.996 6.996 0 0015 7.993 6.997 6.997 0 008 1z"
    clip-rule="evenodd" /></svg>Source (.js)</a><% } %>
<% if (it.dtsGhLink) { %><a class="ghLink" target="blank" href="<%= it.dtsGhLink %>"><svg width="100px" height="100px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="currentColor" fill-rule="evenodd"
    d="M8 1C4.133 1 1 4.13 1 7.993c0 3.09 2.006 5.71 4.787 6.635.35.064.478-.152.478-.337 0-.166-.006-.606-.01-1.19-1.947.423-2.357-.937-2.357-.937-.319-.808-.778-1.023-.778-1.023-.635-.434.048-.425.048-.425.703.05 1.073.72 1.073.72.624 1.07 1.638.76 2.037.582.063-.452.244-.76.444-.935-1.554-.176-3.188-.776-3.188-3.456 0-.763.273-1.388.72-1.876-.072-.177-.312-.888.07-1.85 0 0 .586-.189 1.924.716A6.711 6.711 0 018 4.381c.595.003 1.194.08 1.753.236 1.336-.905 1.923-.717 1.923-.717.382.963.142 1.674.07 1.85.448.49.72 1.114.72 1.877 0 2.686-1.638 3.278-3.197 3.45.251.216.475.643.475 1.296 0 .934-.009 1.688-.009 1.918 0 .187.127.404.482.336A6.996 6.996 0 0015 7.993 6.997 6.997 0 008 1z"
    clip-rule="evenodd" /></svg>Source (.d.ts)</a><% } %>
<% if (it.exampleLink) { %><a class="exampleLink" href=<%= it.exampleLink %>>Example</a><% } %>
</div>

<% if (it.introduction) { %>## Introduction

<%= it.introduction %><% } %>

<% if (it.usage) { %>
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
| ------------- | ------------- | ----- | ---------------- |<% element.arguments.forEach(function(arg) { %>

| `<%= arg.name %>` | <%= arg.types %> | <% if (arg.required) { %>Yes<% } else { %>No<% } %> | <%= arg.description %> |<% }) %>
<% } %>

<% if (element.returns.length) { %>
#### Returns

| Type | Description |
| ----- | ------------- |
<% element.returns.forEach(function(ret) { %>
| <%= ret.types %> | <%= ret.description %> |<% }) %>
<% } %>

<% }) %>
