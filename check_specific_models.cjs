const apiKey = 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

(async () => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        const flash15 = data.models.find(m => m.name.includes('gemini-1.5-flash'));
        console.log("FLASH_1.5:", flash15 ? flash15.name : "NOT_FOUND");
        
        const flash20 = data.models.find(m => m.name.includes('gemini-2.0-flash'));
        console.log("FLASH_2.0:", flash20 ? flash20.name : "NOT_FOUND");
        
        const pro25 = data.models.find(m => m.name.includes('gemini-2.5-pro'));
        console.log("PRO_2.5:", pro25 ? pro25.name : "NOT_FOUND");
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
