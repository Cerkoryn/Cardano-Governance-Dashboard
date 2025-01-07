<script lang="ts">
    import { includeInactiveDReps } from '$lib/stores/stores';

    export let darkMode: boolean;
    export let toggleTheme: () => void;
</script>

<div class="header-bar">
    <div class="left-controls">
        <label class="toggle-label">
            <input 
                type="checkbox" 
                bind:checked={$includeInactiveDReps} 
            />
            Include Inactive dReps
        </label>
    </div>
    <div class="title-wrapper">
        <h1 class="title-text">Cardano Governance Dashboard</h1>
    </div>
    <div class="right-controls">
        <button on:click={toggleTheme}>
            <i class={darkMode ? 'fas fa-sun margin-icon' : 'fas fa-moon margin-icon'}></i>
        </button>
    </div>
</div>

<style>
    :root {
        --header-height: 60px;
    }

    .header-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000; 
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 2rem;
    }

    .left-controls {
        flex: 0 0 auto;
        order: 1; 
    }

    .title-wrapper {
        text-align: center;
        order: 2; 

    }

    .right-controls {
        flex: 0 0 auto;
        order: 3; 
    }

    .title-text {
        margin: 0 auto;
        font-size: 2rem; 
        color: var(--title-text-color);
    }

    .toggle-label {
        display: flex;
        align-items: center;
        font-size: 1rem;
        color: var(--title-text-color);
    }

    .toggle-label input {
        margin-right: 0.5rem;
    }

    .margin-icon {
        font-size: 2rem; 
        color: var(--title-text-color);
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
        color: var(--title-text-color);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
    }

    button:hover {
        background-color: var(--button-hover-bg-color);
    }

    @media (max-width: 768px) {
        :root {
        --header-height: 180px; 
        }

        .header-bar {
            flex-direction: column;
            align-items: center;
        }

        .title-wrapper {
            order: 1; /* Ensure title is on top */
        }

        .left-controls {
            order: 2; 
            margin-bottom: 0.5rem;
        }

        .right-controls {
            order: 3; 
            margin-bottom: 0.5rem; 
        }

        .title-text {
            font-size: 1.5rem; 
        }
    }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">