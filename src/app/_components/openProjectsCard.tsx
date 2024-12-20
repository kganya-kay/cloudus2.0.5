import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const bull = (
  <Box
    component="span"
    sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
  >
    •
  </Box>
);

const card = (
  <React.Fragment>
    <CardContent className='bg-green-200 place-items-center'>
      <div>
      <Typography variant="h2" component="div" >
        15
      </Typography>
      
      </div>
      <Typography variant="h5" component="div">
        Open Projects
      </Typography>
      
      
    </CardContent>
    <CardActions>
      <Button size="small" href='./projects'>View Projects</Button>
    </CardActions>
  </React.Fragment>
);

export default function OutlinedCard() {
  return (
    <Box sx={{ minWidth: 50 }} >
      <Card variant="outlined" >{card}</Card>
    </Box>
  );
}
