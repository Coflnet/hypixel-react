import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <h2>Page not found</h2>
      <Link to="/item/ASPECT_OF_THE_END">return to homepage</Link>
    </div>
  );
}

export default NotFound;
