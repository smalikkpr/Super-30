// Open and close the menu on mobile phones.
// This file is used by every page.
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click", function () {
  menu.classList.toggle("open");
});

menu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    menu.classList.remove("open");
  });
});
