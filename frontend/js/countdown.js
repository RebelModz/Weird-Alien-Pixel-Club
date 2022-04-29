//Countdown Timer
function countdown() {
  const clockdiv = document.getElementById("countdown");
  const countDownTime = clockdiv.getAttribute("data-date") * 1000

  const countdownfunction = setInterval(function () {
    const now = new Date().getTime();
    const diff = countDownTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (diff < 0) {
      clockdiv.classList.add("hidden");
      clearInterval(countdownfunction);
    } else {
      clockdiv.classList.remove("hidden");
      clockdiv.querySelector(".days").style.setProperty("--value", days);;
      clockdiv.querySelector(".hours").style.setProperty("--value", hours);
      clockdiv.querySelector(".minutes").style.setProperty("--value", minutes);
      clockdiv.querySelector(".seconds").style.setProperty("--value", seconds);
    }
  }, 1000);
}
