import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const bull = (
  <Box
    component="span"
    sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}
  >
    •
  </Box>
);

const card = (
  <React.Fragment>
    <CardContent className="place-items-center bg-blue-400">
      <div>
        <Typography variant="h2" component="div">
          Shop
        </Typography>
      </div>
      <Typography variant="h5" component="div">
        Best Quality, You Can Trust
      </Typography>
    </CardContent>
    <CardActions className="justify-center">
      <Button
        style={{ minWidth: "200px", minHeight: "30px", position: "inherit" }}
        variant="contained"
        size="medium"
        href="./shop"
        className="self-center"
      >
        Shop
      </Button>
    </CardActions>
  </React.Fragment>
);

export default function OutlinedCard() {
  return (
    <Box sx={{ minWidth: 275 }}>
      <Card variant="outlined">{card}</Card>
      <br />
    </Box>
  );
}
