#include <iostream>
#include <stdlib.h>
using namespace std;
int main(int argc, char *argv[])
{
	int num, i;
	if (argc == 2)
	{
		num = atoi(argv[1]);
	}
	else
	{
		cout << "input is not a num" << endl;
		return 1;
	}
	for (i = 0; i < num; ++ i)
	{}
	cout << i << endl;
	return 0;
}
