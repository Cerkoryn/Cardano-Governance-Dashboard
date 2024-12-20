<script lang="ts">
    export let darkMode: boolean;
    export let toggleTheme: () => void;
</script>

<div class="header-bar">
    <div class="title-wrapper">
        <h1 class="title-text">Cardano Governance Dashboard</h1>
    </div>
    <button on:click={toggleTheme}>
        <i class={darkMode ? 'fas fa-sun margin-icon' : 'fas fa-moon margin-icon'}></i>
    </button>
</div>

<style>
    .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: 100%; 
        padding: 1rem 2rem; 
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 2rem;
    }
    .title-wrapper {
        flex-grow: 1;
        text-align: center;
    }
    .title-text {
        margin: 0;
        font-size: 2rem; 
        color: var(--title-text-color);
    }
    .margin-icon {
        font-size: 2rem; 
        color: var(--footer-icon-color);
        text-decoration: none;
        margin-left: 1rem;
    }
    .margin-icon:hover {
        color: var(--footer-icon-hover-color); 
    }
    button {
        font-size: 1rem;
        padding: 0rem 0rem;
        background-color: var(--button-bg-color);
        color: var(--button-text-color);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
    }
    button:hover {
        background-color: var(--button-hover-bg-color);
    }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">