
/* 
    A simple progress bar. 
    You can use this code for anything!
*/
class ProgressBar {
    constructor(selector) {

        if (!selector) {
            throw new Error('This doesn\'t work with an empty selector...');
        }

        this.elRoot = document.querySelector(selector);

        // creates an inner DOM element
        this.elValue = document.createElement('div');
        this.elValue.className = 'progressbar-value';
        this.elValue.style.transform = `translate(-100%, 0)`;
        this.elRoot.appendChild(this.elValue);
        this.percent = 0;
    }

    /* 
        Sets the value for the progress bar.
        The value is expected to be a percentage of the progress.
    */
    setValue(percentValue) {
        this.percent = percentValue;
        this.updateUI();
    }

    /* 
        Updates the UI of the progress bar.
    */
    updateUI() {
        this.elValue.style.transform = `translate(${this.percent - 100}%, 0)`;
    }

    /* 
        Resets the progress bar and enable a "fresh start".
    */
    reset() {
        this.elValue.style.display = "none";

        setTimeout(() => {
            this.percent = 0;
            this.updateUI();
            this.elValue.style.display = "block";
        }, 5);
    }
}

export default ProgressBar;