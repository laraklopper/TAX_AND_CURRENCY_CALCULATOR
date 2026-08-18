# STYLES

## TABLE OF CONTENTS
1. [HTML STYLING](#1-html-styling)
    - [1.1. BODY/HTML/ROOT](#11-bodyhtmlroot)
    - [1.2. HEADER/FOOTER/SECTION](#12-headerfootersection)
    - [1.3. NAVIGATION-BAR](#13-navigation-bar)
    - [1.4. FORMS](#14-forms)
    - [1.5. TABLES](#15-tables)
    - [1.6. BUTTONS](#16-buttons)
2. [BOOTSTRAP](#2-bootstrap)
    - [2.1. INSTALLATION](#21-installation)
    - [2.2. BOOTSTRAP BREAKPOINTS](#22-bootstrap-breakpoints)
    - [2.3. BOOTSTRAP COLOURS](#23-bootstrap-colours)
3. [GOOGLE FONTS](#3-google-fonts)
4. [LUCIDE REACT](#4-lucide-react)
5. [REFERENCES](#5-references)

---

## 1. HTML STYLING

General styling formats, not all formats apply for all tags.

### 1.1. BODY/HTML/ROOT
```css
html, #body{
  background-color: #787878;
  border: solid #787878;
}
```
### 1.2. HEADER/FOOTER/SECTION
```css
/* Header */
#header{
 background-color: #B6C6D4;
}
.pageHeading{
    color: #470D09;
    font-size:;
    font-family: "Roboto Condensed", sans-serif;
}
/* Footer */
#footer{
  background-color: #7A7A7A;
}
```
*SECTION*
```css
#section1{
    display: flex;
    margin: 0px;
    padding: 0px;
    width: 100%;
    background-color: #7A7A7A;
}
#section2{
  display: flex;
  margin: 0px;
  padding: 0px;
  width: 100%;
  background-color: #C4C4C4;
}
```
### 1.3. NAVIGATION BAR
```css
#mainNavbar{
    margin: 0px;
    padding: 0px;
    display: flex;
    gap: 10px;
    list-style-type: none;
}


```
### 1.4. FORMS

````css
/* Form panal */
#panal{
  background-color: #9E9E9E;
  margin
  padding
}
/* Form */

form{
background-color: #A8AEB3;
margin: 0px;
padding: 0px;
}

.form-input-details{
      background-color: #BFBFBF;
  width: 80%;
  margin: 0px;
padding: 0px;
}
/* FORM GROUPS */
.form-group{
    border: solid #323A42 2px;
    background: #D6D6D6;
    border-radius: 8px;
}
/* GENERAL TEXT FORMAT */

#formHeading{
  color: #000000;
  font-family: "Roboto", sans-serif;
  font-weight: 700;
  margin: 0px;
  padding: 0px;
}

.label{
  font-family: "Roboto Mono", monospace;
  font-weight: 700;
  margin: 0px;
  letter-spacing: 1px;
  padding: 0px;
}

.infoText{
  text-transform: uppercase;
    color: #444;
    text-align: center;
    margin: 0px;
    padding: 10px 0px;
    font-family: "Open Sans", sans-serif;
}
#requiredIcon{
  color: #C22419;
  font-family: "Open Sans", sans-serif;
  margin: 0px;
  letter-spacing: 1px;
  padding: 0px;
}
````
### 1.5. TABLES

```css
.evenRow{
  color: #404040;
  background-color: #E8F0F6;
}
.oddRow{
  color: #404040;
  background-color: #9BB1C7;
}

```

### 1.6. BUTTONS

Background color for buttons is based on bootstrap variant
```css
#button,
#submitBtn,
#toggleButton{
   display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 40px;
    font-family: "Courier Prime", monospace;
    font-weight: 700;
    text-transform: uppercase;
    color: #000;
    margin: 0px;
    padding: 0px;
    border: solid 2px #323A42;
}
#button:hover,
#submitBtn:hover,
#toggleEditPswdBtn:hover{
    color: #E8F0F6;
    background-color: #323A42;
}
```
## 2. BOOTSTRAP

### 2.1. INSTALLATION

```
npm install react-bootstrap bootstrap
```
### 2.2. BOOTSTRAP BREAKPOINTS
```
<!-- Breakpoints -->
root {
    --bs-breakpoint-xs: 0;
    --bs-breakpoint-sm: 576px;
    --bs-breakpoint-md: 768px;
    --bs-breakpoint-lg: 992px;
    --bs-breakpoint-xl: 1200px;
    --bs-breakpoint-xxl: 1400px;
}

```
### 2.3. BOOTSTRAP COLOURS
```css
<!-- colours -->
    --bs-primary: #0d6efd;
    --bs-secondary: #6c757d;
    --bs-success: #198754;
    --bs-info: #0dcaf0;
    --bs-warning: #ffc107;
    --bs-danger: #dc3545;
    --bs-light: #f8f9fa;
    --bs-dark: #212529;

```
---
## 3. GOOGLE FONTS

`index.html`
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```
```css
font-family: "Noto Serif", serif;
font-family: "Roboto", sans-serif;
font-family: "Open Sans", sans-serif;
font-family: "Courier Prime", monospace;
font-family: "Fira Sans", sans-serif;
```
## 4. LUCIDE-REACT

```bash
npm install lucide-react
```

## 5. REFERENCES

- https://react-bootstrap.netlify.app/
- https://fonts.google.com/
- https://lucide.dev/guide/react/
- https://www.w3schools.com/colors/colors_groups.asp
- https://color.adobe.com/create/color-wheel