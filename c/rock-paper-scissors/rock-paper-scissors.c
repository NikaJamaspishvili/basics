#include <stdio.h>
#include <stdlib.h>
#include <math.h>


// 0 - rock
// 1 - paper
// 2 - scissors

// player1 = 0
// player2 = 1

int main(){
    int player1 = -1;
    int player2 = -1;
    int winner = -1;

    while(player1 > 2 || player1 < 0){
        printf("player 1 turn");
        printf("Choose: Rock = 0, Paper = 1, scissors = 2: ");
        scanf("%d",&player1);
    }

    while(player2 > 2 || player2 < 0){
        printf("player 2 turn");
        printf("Choose: Rock = 0, Paper = 1, scissors = 2: ");
        scanf("%d",&player2);
    }

    if (player1 == player2) {
        printf("It's a tie!\n");
    } 
    else if (player1 == 0) { // Rock
        if (player2 == 1)      winner = 2; // Paper beats Rock -> Player 2
        else if (player2 == 2) winner = 1; // Rock beats Scissors -> Player 1
    } 
    else if (player1 == 1) { // Paper
        if (player2 == 0)      winner = 1; // Paper beats Rock -> Player 1
        else if (player2 == 2) winner = 2; // Scissors beats Paper -> Player 2
    } 
    else if (player1 == 2) { // Scissors
        if (player2 == 0)      winner = 2; // Rock beats Scissors -> Player 2
        else if (player2 == 1) winner = 1; // Scissors beats Paper -> Player 1
    }

    if(winner == 1){
        printf("Winner is player 1");
    }else if(winner == 2){
        printf("Winner is player 2");
    }

    player1 = -1;
    player2 = -1;
    winner = -1;

    return EXIT_SUCCESS;
}
