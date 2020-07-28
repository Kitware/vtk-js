<footer id="footer" class="wrapper">
  <div class="inner">
    <div id="footer-copyright">
      &copy; {{ moment(Date.now()).year() }} <a href="{{ config.authorLink }}" target="_blank">{{ config.author }}</a>
    </div>

    <div id="footer-links">
      <a href="https://github.com/{{ config.github }}" class="footer-link" target="_blank"><i class="fa fa-github-alt"></i></a>
    </div>
  </div>
    <a
      style="position: fixed; background: #00529b; color: white; top: 0; right: 0; height: 70px"
      href="https://www.kitware.com/careers"
    >
      <div style="position: relative; text-align: center;">
        <div
          style="margin-top: 5px; background: url(https://www.cmake.org/wp-content/uploads/2018/09/jobs_icon.png) no-repeat; background-size: 100%; width: 50px; height: 40px; margin: 5px auto 0;"
        ></div>
        <span style="padding: 5px 10px">Kitware is Hiring</span>
      </div>
    </a>
</footer>
