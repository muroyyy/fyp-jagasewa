import { Route } from 'react-router-dom';
import Landing from '../pages/general/Landing';
import Messages from '../pages/general/Messages';

export const generalRoutes = (
  <>
    <Route path="/" element={<Landing />} />
    <Route path="/messages" element={<Messages />} />
  </>
);
