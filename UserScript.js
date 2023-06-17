// ==UserScript==
// @name            Endless Google (improved)
// @description     Load more results automatically and endlessly.
// @author          tumpio
// @namespace       tumpio@sci.fi
// @homepageURL     https://openuserjs.org/scripts/tumpio/Endless_Google
// @supportURL      https://github.com/tumpio/gmscripts/issues
// @icon            https://github.com/tumpio/gmscripts/raw/master/Endless_Google/large.png
// @match           *://www.google.com/*
// @match           *://encrypted.google.com/*
// @run-at          document-start
// @version         0.0.7-LoonerNinja
// @license         MIT
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @grant           GM_addStyle
// @noframes
// ==/UserScript==


// This is LoonerNinja's tiny fork of tumpio's original which:
// 1. Removes the page navigation buttons at the bottom.
// 2. Removes the repeating "Related searches" when the next page loads.
// 3. Move the location bar from bottom to the topbar.
// 4. Stop the infinite scrolling when there are no more results to load.

// NOTE: Don't run on image search
if (location.href.indexOf("tbm=isch") !== -1){
    return;
}
// NOTE: Do not run on iframes
if (window.top !== window.self){
    return;
}

const centerElement = "#center_col";
const loadWindowSize = 1.6;
const filtersAll = ["#foot", "#bottomads"];
const filtersCol = filtersAll.concat(["#extrares", "#imagebox_bigimages"]);
let msg = "";

const css = `
.page-number {
  position: relative;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
	margin-bottom: 2em;
	color: #808080;
}
.page-number::before {
  content: "";
  background-color: #ededed;
  height: 1px;
  width: 100%;
  margin: 1em 3em;
}
.endless-msg {
  position:fixed;
  bottom:0;
  left:0;
  padding:5px 10px;
  background: darkred;
  color: white;
  font-size: 11px;
  display: none;
}
.endless-msg.shown {
  display:block;
}
`;

let pageNumber = 1;
let prevScrollY = 0;
let nextPageLoading = false;
let idx = 0;

function requestNextPage() {
    let idname = !!document.getElementById("ofr"); //check if there are no more results to load and stops the infinite scrolling.
    let cn1 = document.getElementsByClassName("v7W49e")[idx];
    if (idname == true){
        return;
    };
    if (cn1.lastChild == null){
        window.removeEventListener("scroll", onScrollDocumentEnd);
        cn1.closest(".next-col").parentNode.removeChild(cn1.closest(".next-col"));
        return;
    };
    nextPageLoading = true;
    let nextPage = new URL(location.href);
    if (!nextPage.searchParams.has("q")) return;

    nextPage.searchParams.set("start", String(pageNumber * 10));
    !msg.classList.contains("shown") && msg.classList.add("shown");
    fetch(nextPage.href)
        .then(response => response.text())
        .then(text => {
            let parser = new DOMParser();
            let htmlDocument = parser.parseFromString(text, "text/html");
            let content = htmlDocument.documentElement.querySelector(centerElement);

            content.id = "col_" + pageNumber;
            filter(content, filtersCol);

            content.style.marginLeft = '0';

            let pageMarker = document.createElement("div");
            pageMarker.textContent = String(pageNumber + 1);
            pageMarker.className = "page-number";

            let col = document.createElement("div");
            col.className = "next-col";
            col.appendChild(pageMarker);
            col.appendChild(content);
            document.querySelector(centerElement).appendChild(col);

            if (!content.querySelector("#rso")) {
                // end of results
                window.removeEventListener("scroll", onScrollDocumentEnd);
                nextPageLoading = false;
                msg.classList.contains("shown") && msg.classList.remove("shown");
                return;
            }

            pageNumber++;
            idx++;
            nextPageLoading = false;
            msg.classList.contains("shown") && msg.classList.remove("shown");
        });
}

function onScrollDocumentEnd() {
    let y = window.scrollY;
    let delta = y - prevScrollY;
    let elem = document.querySelector('tr[jsname="TeSSVd"]').childNodes.length
    if (!nextPageLoading && delta > 0 && isDocumentEnd(y) && elem > 0) {
        requestNextPage();
    }
    prevScrollY = y;
    let allElems = document.querySelectorAll('*'), // Hides the repeating "Related searches" as the next page loads.
    elems = [],
    obj = {};
    Array.from(allElems).forEach(v => v.getAttribute('class') ? elems.push(v) : null);
    elems.forEach(v => {!obj[v.getAttribute('class')] ? obj[v.getAttribute('class')] = 1 : obj[v.getAttribute('class')]++});
    Object.keys(obj).forEach(function(v) {
        let elements = document.getElementsByClassName('oIk2Cb');
        if (obj[v] > 1) {
            Array.from(elements).forEach(v => {v.hidden = true});
            elements[0].hidden = false;
        }
    });
}

function isDocumentEnd(y) {
    return y + window.innerHeight * loadWindowSize >= document.body.clientHeight;
}

function filter(node, filters) {
    for (let filter of filters) {
        let child = node.querySelector(filter);
        if (child) {
            child.parentNode.removeChild(child);
        }
    }
}

function init() {
    $(".fbar.b2hzT").appendTo(".LHJvCe"); // move the location bar to the top to be seen easily.
    GM_addStyle(`
        .fbar.b2hzT {display: inline-block; border-bottom: none; padding: 0px 15px; float: right !important; }
        .b0KoTc {margin-left: 0 !important; }
        #swml { border-left: none !important; }
        .Q8LRLc {display: inline-block !important; }
        #appbar {padding-bottom: 5px !important; }
        .LHJvCe {position: inherit !important;}
    `)
    let cn2 = !!document.querySelector("#topstuff .mnr-c"); //When 0 results.
    if (cn2 == true){
        return;
    }
    prevScrollY = window.scrollY;
    window.addEventListener("scroll", onScrollDocumentEnd);
    filter(document, filtersAll);
    let style = document.createElement("style");
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
    msg = document.createElement("div");
    msg.setAttribute("class", "endless-msg");
    msg.innerText = "Loading next page...";
    document.body.appendChild(msg);
}

document.addEventListener("DOMContentLoaded", init);

// Hides the bottom page navigation bar.
GM_addStyle(".AaVjTc { display: none !important; }");
