import React from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import COLORS from '../constants/colors';
import Button from '../components/Button';

const Welcome = ({ navigation }) => {
    return (
        <LinearGradient
            style={{ flex: 1 }}
            colors={[COLORS.secondary, COLORS.primary]}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
                <View>
                    <Image
                        source={{uri:'./../assets/hero1.jpg'}}
                        style={{
                            height: 100,
                            width: 100,
                            borderRadius: 20,
                            position: "absolute",
                            top: 10,
                            transform: [
                                { translateX: 20 },
                                { translateY: 50 },
                                { rotate: "-15deg" }
                            ]
                        }}
                    />

                    <Image
                        source={require("../assets/hero3.jpg")}
                        style={{
                            height: 100,
                            width: 100,
                            borderRadius: 20,
                            position: "absolute",
                            top: -30,
                            left: 100,
                            transform: [
                                { translateX: 50 },
                                { translateY: 50 },
                                { rotate: "-5deg" }
                            ]
                        }}
                    />

                    <Image
                        source={require("../assets/hero3.jpg")}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 20,
                            position: "absolute",
                            top: 130,
                            left: -50,
                            transform: [
                                { translateX: 50 },
                                { translateY: 50 },
                                { rotate: "15deg" }
                            ]
                        }}
                    />

                    <Image
                        source={require("../assets/hero2.jpg")}
                        style={{
                            height: 200,
                            width: 200,
                            borderRadius: 20,
                            position: "absolute",
                            top: 110,
                            left: 100,
                            transform: [
                                { translateX: 50 },
                                { translateY: 50 },
                                { rotate: "-15deg" }
                            ]
                        }}
                    />
                </View>

                {/* المحتوى */}
                <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
                    <Text style={{ fontSize: 50, fontWeight: '800', color: COLORS.white }}>لنبدأ</Text>
                    <Text style={{ fontSize: 46, fontWeight: '800', color: COLORS.white }}>الآن</Text>

                    <View style={{ marginVertical: 22 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.white, marginBottom: 8 }}>تسوق معنا عبر YAM</Text>
                        <Text style={{ fontSize: 16, color: COLORS.white, lineHeight: 24 }}>اكتشف مجموعة واسعة من المتاجر وتمتع بتجربة تسوق مميزة معنا. يمكنك الآن الاستمتاع بالتسوق بأمان والتواصل المباشر مع البائعين.</Text>
                    </View>

                    <Button
                        title="انضم الآن"
                        onPress={() => navigation.navigate("Signup")}
                        style={{ marginTop: 22, width: "100%" }}
                    />

                    <View style={{ flexDirection: "row", marginTop: 12, justifyContent: "center", paddingBottom: 20 }}>
                        <Text style={{ fontSize: 16, color: COLORS.white }}>هل لديك حساب بالفعل؟</Text>
                        <Pressable
                            onPress={() => navigation.navigate("Login")}
                            style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}
                        >
                            <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: "bold" }}>تسجيل الدخول</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Welcome;
