let count = 0;

const value = document.querySelector("#value");
const btns = document.querySelectorAll(".btn");

// btns.forEach((btn)=>{
//     btn.addEventListener('click',e=>console.log(e.currentTarget))
// })

//am merge sa scrii si cu forEach si cu for of si sa ii scrii ca function expersion nu ca arrow function
for (let btn of btns) {
  btn.addEventListener("click", function (e) {
    const styles = e.currentTarget.classList;
    if (styles.contains("decrease")) {
      count--;
    } else if (styles.contains("increase")) {
      count++;
    } else {
      count = 0;
    }
    if (count > 0) {
      value.style.color = "green";
    } else if (count === 0) {
      value.style.color = "#222";
    } else {
      value.style.color = "red";
    }

    value.textContent = count;
  });
}
