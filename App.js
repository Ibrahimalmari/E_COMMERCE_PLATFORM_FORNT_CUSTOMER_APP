import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import React from 'react';
import { Login, Signup, Welcome ,VerifyEmailScreen ,HomeScreen ,MapScreen ,StoreDetailsScreen,CompleteRegistrationScreen,AccountScreen ,Header , Footer, AddressDetailsScreen} from "./screens";

const Stack = createNativeStackNavigator();

export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Welcome'
      >
     
   
          <Stack.Screen 
        name="Login"
        component={Login} 
        options={{
          headerShown: false
        }}
        />
          <Stack.Screen 
        name="Footer"
        component={Footer} 
        options={{
          headerShown: false
        }}
        />
          <Stack.Screen 
        name="Header"
        component={Header} 
        options={{
          headerShown: false
        }}
        />
      
         <Stack.Screen 
        name="CompleteRegistrationScreen"
        component={CompleteRegistrationScreen} 
        options={{
          headerShown: false
        }}
        />

         <Stack.Screen 
        name="VerifyEmailScreen"
        component={VerifyEmailScreen} 
        options={{
          headerShown: false
        }}
        />
        
        <Stack.Screen 
        name="HomeScreen"
        component={HomeScreen} 
        options={{
          headerShown: false
        }}
        />
        
         <Stack.Screen 
        name="AccountScreen"
        component={AccountScreen} 
        options={{
          headerShown: false
        }}
        />

          <Stack.Screen 
        name="MapScreen"
        component={MapScreen} 
        options={{
          headerShown: false
        }}
        />
         <Stack.Screen 
        name="AddressDetailsScreen"
        component={AddressDetailsScreen} 
        options={{
          headerShown: false
        }}
        />


      </Stack.Navigator>
    </NavigationContainer>
  );
}