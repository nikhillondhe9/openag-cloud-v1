import {StackNavigator} from 'react-navigation';
import {SignUp} from "./signup";

export const AppNavigator = StackNavigator({
  signup: { screen: SignUp }
});