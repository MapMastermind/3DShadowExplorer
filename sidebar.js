// САЙДБАР: вкладки о проекте и тд, кнопка бургера 

document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const burgerButton = document.getElementById('burger-button');
  const tabButtons = document.querySelectorAll('.tab-button');

  tabs.forEach(function(tab, index) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(tab) {
        tab.classList.remove('active');
      });
      tabContents.forEach(function(content) {
        content.classList.remove('active');
      });

      this.classList.add('active');
      tabContents[index].classList.add('active');
    });
  });

  tabContents.forEach(function(content) {
    content.classList.remove('active');
  });

  tabs[0].click();

  burgerButton.addEventListener('click', function() {
    document.body.classList.toggle('tab-hidden');

    
    
    tabButtons.forEach(function(button) {
      button.classList.remove('active');
      button.style.display = button.style.display === 'none' ? 'block' : 'none';
    });
    tabContents.forEach(function(content) {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    burgerButton.style.right = burgerButton.style.right === 'calc(50% - 20px)' ? '10px' : 'calc(50% - 20px)';

    // Деактивация всех вкладок
    tabContents.forEach(function(content) {
      content.style.display = 'none';
    });
  });

  tabButtons.forEach(function(button, index) {
    button.addEventListener('click', function() {
      tabContents.forEach(function(content) {
        content.style.display = 'none';
      });
      tabContents[index].style.display = 'block';
    });
  });
});
