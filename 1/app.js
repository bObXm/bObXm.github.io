const colors = ["green", "red", "pink", "black", "blue", "yellow"];
const btn = document.getElementById("btn");
const color = document.querySelector(".color");

btn.addEventListener("click", function () {
  const randomNr = getRandomNr();
  console.log(randomNr);
  document.body.style.backgroundColor = colors[randomNr];
  color.textContent = colors[randomNr];
});

function getRandomNr() {
  return Math.floor(Math.random() * colors.length);
}
